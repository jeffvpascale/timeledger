using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Dtos
{
	public class ClientCreateDto
	{
		[Required]
		public string Name { get; set; } = string.Empty;

	}
}
