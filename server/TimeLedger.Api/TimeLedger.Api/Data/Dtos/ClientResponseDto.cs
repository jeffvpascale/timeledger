using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Dtos
{
	public class ClientResponseDto
	{
		public int Id { get; set; }

		[Required]
		public string Name { get; set; } = string.Empty;

		public bool IsArchived { get; set; }

	}
}
